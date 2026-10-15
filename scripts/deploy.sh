#!/usr/bin/env bash
# Builds the app and publishes it to the S3 bucket behind CloudFront.
#
# Uses whatever AWS credentials the environment provides -- set AWS_PROFILE (e.g. AWS_PROFILE=ben)
# for local use. Bucket and distribution come from Terraform outputs, so `terraform apply` must have
# run first.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
APP_DIR="${REPO_ROOT}/app"
DIST_DIR="${APP_DIR}/dist"
TF_DIR="${REPO_ROOT}/iac/terraform"

echo "Using AWS_PROFILE=${AWS_PROFILE:-<default credentials>}"

tf_output() {
  terraform -chdir="${TF_DIR}" output -raw "$1"
}

BUCKET="$(tf_output bucket_name)"
DISTRIBUTION_ID="$(tf_output distribution_id)"
SITE_URL="$(tf_output site_url)"

echo "==> Building"
(cd "${APP_DIR}" && npm ci && npm run build)

# 1. Fingerprinted assets, cached for a year. They go up first, so the new index.html is never live
#    while a file it references is missing. Nothing is deleted yet: anyone still running the
#    previous build keeps loading its flags.
#
#    --size-only because the name already identifies the content: a hashed file that exists in the
#    bucket is this file. Without it every rebuild's fresh timestamps re-upload all ~270 of them.
echo "==> Uploading hashed assets"
aws s3 sync "${DIST_DIR}/assets" "s3://${BUCKET}/assets" \
  --cache-control "public, max-age=31536000, immutable" \
  --size-only \
  --no-progress

# 2. Everything else that is not index.html (favicon.svg and any future public/ file). Their names
#    carry no hash, so they are revalidated on every request.
echo "==> Uploading unhashed files"
aws s3 sync "${DIST_DIR}" "s3://${BUCKET}" \
  --exclude "assets/*" \
  --exclude "index.html" \
  --cache-control "no-cache" \
  --no-progress

# 3. index.html last. This is the moment the new build goes live.
echo "==> Uploading index.html"
aws s3 cp "${DIST_DIR}/index.html" "s3://${BUCKET}/index.html" \
  --cache-control "no-cache" \
  --content-type "text/html; charset=utf-8" \
  --no-progress

# 4. Remove files no build references any more. --size-only means nothing just uploaded is sent
#    again (which would drop its Cache-Control); with every file already in place, the only thing
#    this sync does is delete.
echo "==> Removing stale files"
aws s3 sync "${DIST_DIR}" "s3://${BUCKET}" --delete --size-only --no-progress

# 5. /index.html is never cached at the edge, but "/" is the same document served as the default
#    root object under the default cache behavior, so both are invalidated.
echo "==> Invalidating CloudFront"
INVALIDATION_ID="$(aws cloudfront create-invalidation \
  --distribution-id "${DISTRIBUTION_ID}" \
  --paths "/index.html" "/" \
  --query 'Invalidation.Id' --output text)"
echo "Invalidation ${INVALIDATION_ID} created"

echo
echo "Deployed: ${SITE_URL}"
