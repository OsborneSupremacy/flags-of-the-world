locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.region

  use_custom_domain = var.domain_name != null

  # In this account's regional namespace, like ses-ui's inbox bucket: the "-an" suffix reserves the
  # name to this account, so it can never be re-created by anyone else if the bucket is deleted.
  # Composed from the caller identity rather than written out, which also keeps the account id out
  # of the repository.
  spa_bucket_name = "bro-flags-of-the-world-${local.account_id}-${local.region}-an"

  site_url = local.use_custom_domain ? "https://${var.domain_name}" : "https://${aws_cloudfront_distribution.spa.domain_name}"
}
