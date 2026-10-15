output "bucket_name" {
  description = "S3 bucket the site is uploaded to"
  value       = aws_s3_bucket.spa.bucket
}

output "distribution_id" {
  description = "CloudFront distribution, for invalidation after a deploy"
  value       = aws_cloudfront_distribution.spa.id
}

output "site_url" {
  description = "Where the site is served"
  value       = local.site_url
}
