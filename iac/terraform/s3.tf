resource "aws_s3_bucket" "spa" {
  bucket           = local.spa_bucket_name
  bucket_namespace = "account-regional"
}

# Nothing reaches this bucket except CloudFront, and all four settings are on so it stays that way.
# There is no website hosting configuration: the bucket is an origin read over the S3 API through
# Origin Access Control, not a website.
resource "aws_s3_bucket_public_access_block" "spa" {
  bucket = aws_s3_bucket.spa.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# SSE-S3. The bucket holds a public JavaScript bundle and flag images; a customer managed key would
# mean granting CloudFront decrypt on it for no confidentiality gain -- the same reasoning ses-ui
# gives for its SPA bucket.
resource "aws_s3_bucket_server_side_encryption_configuration" "spa" {
  bucket = aws_s3_bucket.spa.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_ownership_controls" "spa" {
  bucket = aws_s3_bucket.spa.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

data "aws_iam_policy_document" "spa_bucket" {
  statement {
    sid    = "AllowCloudFrontRead"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.spa.arn}/*"]

    # This distribution, not any distribution in the account.
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.spa.arn]
    }
  }

  # Belt and braces: refuse anything not over TLS, including the deploy script's own uploads.
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    resources = [aws_s3_bucket.spa.arn, "${aws_s3_bucket.spa.arn}/*"]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "spa" {
  bucket = aws_s3_bucket.spa.id
  policy = data.aws_iam_policy_document.spa_bucket.json

  # The policy must not race the public access block: applying both at once can fail with an
  # AccessDenied that looks like a permissions problem.
  depends_on = [aws_s3_bucket_public_access_block.spa]
}
