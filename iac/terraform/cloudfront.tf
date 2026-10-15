resource "aws_cloudfront_origin_access_control" "spa" {
  name                              = "flags-of-the-world-spa"
  description                       = "CloudFront access to the flags-of-the-world bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Security headers, and a content security policy that matches what the app actually loads: its
# own scripts and stylesheets, its own SVG flags, and nothing from anywhere else.
#
# Kept in step by hand with the dev server's copy in app/vite.config.ts.
resource "aws_cloudfront_response_headers_policy" "spa" {
  name = "flags-of-the-world-security-headers"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = false
      preload                    = false
      override                   = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "DENY"
      override     = true
    }

    referrer_policy {
      referrer_policy = "no-referrer"
      override        = true
    }

    content_security_policy {
      override = true

      content_security_policy = join("; ", [
        # Covers scripts (Vite emits external module files, so no 'unsafe-inline'), fetches,
        # fonts and the favicon.
        "default-src 'self'",
        # data: is not used by the current build -- inlining is off in vite.config.ts -- but costs
        # nothing for images and keeps a future small inlined asset from failing silently.
        "img-src 'self' data:",
        # 'unsafe-inline' for React style attributes (progress bar widths, the look-alikes grid).
        "style-src 'self' 'unsafe-inline'",
        "frame-ancestors 'none'",
        "base-uri 'none'",
        "form-action 'none'",
      ])
    }
  }
}

resource "aws_cloudfront_distribution" "spa" {
  enabled             = true
  is_ipv6_enabled     = true
  http_version        = "http2and3"
  comment             = "flags-of-the-world"
  default_root_object = "index.html"
  aliases             = local.use_custom_domain ? [var.domain_name] : []

  # North America and Europe. This is a family app.
  price_class = "PriceClass_100"

  origin {
    origin_id                = "spa"
    domain_name              = aws_s3_bucket.spa.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.spa.id
  }

  default_cache_behavior {
    target_origin_id       = "spa"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    # Managed-CachingOptimized. Vite fingerprints everything under /assets, so it can be cached
    # indefinitely; index.html is handled by the behavior below.
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    response_headers_policy_id = aws_cloudfront_response_headers_policy.spa.id
  }

  # index.html is never cached at the edge, as in ses-ui. Everything else is fingerprinted, so this
  # one file is what makes a deploy visible. The deploy script also invalidates it, which covers
  # "/" -- the default root object is cached under that path by the behavior above.
  ordered_cache_behavior {
    path_pattern           = "/index.html"
    target_origin_id       = "spa"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    # Managed-CachingDisabled.
    cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"

    response_headers_policy_id = aws_cloudfront_response_headers_policy.spa.id
  }

  # A safety net only. The app has no client-side routes, so the one URL anyone should request is
  # "/". A stray path gets the app rather than an S3 AccessDenied page; S3 answers 403, not 404,
  # for a missing key when the caller lacks ListBucket, which is why both are mapped.
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = local.use_custom_domain ? aws_acm_certificate_validation.spa[0].certificate_arn : null
    ssl_support_method             = local.use_custom_domain ? "sni-only" : null
    minimum_protocol_version       = local.use_custom_domain ? "TLSv1.2_2021" : "TLSv1"
    cloudfront_default_certificate = !local.use_custom_domain
  }
}
