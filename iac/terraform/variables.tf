# Where the site is served. null serves it from the distribution's *.cloudfront.net name instead,
# with no certificate or DNS records.
#
# Must be under osbornesupremacy.com when set: that is the only zone the landing zone's remote state
# hands this configuration, and a name elsewhere would plan cleanly and then fail certificate
# validation, waiting on records written into a zone that does not serve them.
variable "domain_name" {
  description = "Hostname for the site, under osbornesupremacy.com, or null for the CloudFront default"
  type        = string
  default     = "flags.osbornesupremacy.com"
  nullable    = true

  validation {
    condition     = var.domain_name == null || endswith(coalesce(var.domain_name, "-"), ".osbornesupremacy.com")
    error_message = "domain_name must be a subdomain of osbornesupremacy.com, or null."
  }
}
