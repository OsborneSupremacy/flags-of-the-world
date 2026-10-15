# The role .github/workflows/deploy.yml assumes to publish the site.
#
# Its own role rather than the landing zone's github-actions role, which ses-ui uses. That one is
# AdministratorAccess for every repository under the account; this one can upload to one bucket and
# invalidate one distribution, from one branch of one repository, and nothing else.
#
# The OIDC provider belongs to the landing zone, which also trusts it for its own role. An account
# can register token.actions.githubusercontent.com only once, so this configuration reads it rather
# than declaring a second.
data "aws_iam_policy_document" "github_deploy_assume_role" {
  statement {
    sid     = "GitHubActionsAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.terraform_remote_state.lz.outputs.github_oidc_provider.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # main only: a pull request, or a workflow run from any other branch, cannot assume this.
    #
    # The immutable subject form, in which the owner and repository each carry their numeric id. This
    # repository was created after GitHub made that the default, so its sub never has the plain
    # "repo:OsborneSupremacy/flags-of-the-world" form, and a condition written for that would deny
    # every run with nothing wrong at the AWS end. The landing zone's trust policy explains the two
    # forms. Confirm the prefix with:
    #
    #   gh api /repos/OsborneSupremacy/flags-of-the-world/actions/oidc/customization/sub
    #
    # StringEquals, not StringLike: there is exactly one subject this role is for.
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["${local.github_sub_prefix}:ref:refs/heads/main"]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name               = "flags-of-the-world-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_deploy_assume_role.json
}

# Exactly what scripts/deploy.sh does, and no more.
data "aws_iam_policy_document" "github_deploy" {
  # aws s3 sync lists the bucket to work out what to upload and what to delete.
  statement {
    sid       = "ListSiteBucket"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.spa.arn]
  }

  # Put for the upload, Delete for removing files no build references any more. No Get: sync
  # compares by listing, never by reading objects back.
  statement {
    sid       = "WriteSiteObjects"
    effect    = "Allow"
    actions   = ["s3:PutObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.spa.arn}/*"]
  }

  # This distribution only. The workflow is given its id rather than finding it by alias as ses-ui
  # does, because the lookup needs cloudfront:ListDistributions, which cannot be scoped to one
  # distribution.
  statement {
    sid       = "InvalidateDistribution"
    effect    = "Allow"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = [aws_cloudfront_distribution.spa.arn]
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  name   = "${aws_iam_role.github_deploy.name}-policy"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.github_deploy.json
}
