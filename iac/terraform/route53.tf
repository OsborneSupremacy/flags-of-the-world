# Alias records rather than CNAMEs, and both address families. The zone belongs to the landing zone;
# these records belong here.
resource "aws_route53_record" "spa" {
  for_each = local.use_custom_domain ? toset(["A", "AAAA"]) : toset([])

  zone_id = data.terraform_remote_state.lz.outputs.route53_osbornesupremacy_com_hosted_zone.id
  name    = var.domain_name
  type    = each.key

  alias {
    name                   = aws_cloudfront_distribution.spa.domain_name
    zone_id                = aws_cloudfront_distribution.spa.hosted_zone_id
    evaluate_target_health = false
  }
}
