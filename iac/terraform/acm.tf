# The certificate CloudFront serves, only when a custom domain is set.
#
# CloudFront reads certificates from us-east-1 only. This whole configuration runs in us-east-1, so
# no aliased provider is needed -- the same call ses-ui makes. If the default region ever moves,
# this resource needs a provider = aws.us_east_1 alias.
resource "aws_acm_certificate" "spa" {
  count = local.use_custom_domain ? 1 : 0

  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    # A certificate cannot be replaced while a distribution uses it. Creating the new one first makes
    # the swap an update rather than an outage.
    create_before_destroy = true
  }
}

resource "aws_route53_record" "spa_certificate_validation" {
  for_each = {
    for option in(local.use_custom_domain ? aws_acm_certificate.spa[0].domain_validation_options : []) :
    option.domain_name => {
      name   = option.resource_record_name
      record = option.resource_record_value
      type   = option.resource_record_type
    }
  }

  zone_id         = data.terraform_remote_state.lz.outputs.route53_osbornesupremacy_com_hosted_zone.id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

# Blocks until the certificate is issued, so the distribution is never created against a
# certificate still pending validation.
resource "aws_acm_certificate_validation" "spa" {
  count = local.use_custom_domain ? 1 : 0

  certificate_arn         = aws_acm_certificate.spa[0].arn
  validation_record_fqdns = [for record in aws_route53_record.spa_certificate_validation : record.fqdn]
}
