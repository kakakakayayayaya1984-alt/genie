
# -- IAM: SSM access (Session Manager, no SSH)
data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ssm_role" {
  name               = "rm-ec2-ssm-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ssm_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "ssm_profile" {
  name = "rm-ec2-ssm-instance-profile"
  role = aws_iam_role.ssm_role.name
}

data "aws_iam_policy_document" "cloudwatch_logs_access" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogStreams",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "cloudwatch_logs_policy" {
  name   = "roommitra-cloudwatch-logs"
  policy = data.aws_iam_policy_document.cloudwatch_logs_access.json
}

resource "aws_iam_role_policy_attachment" "attach_logs_policy" {
  role       = aws_iam_role.ssm_role.name
  policy_arn = aws_iam_policy.cloudwatch_logs_policy.arn
}


# IAM policy allowing uploads
resource "aws_iam_policy" "s3_upload_policy" {
  name        = "${aws_iam_role.ssm_role.name}-s3-upload"
  description = "Allow EC2 to put objects to S3 under a specific prefix"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid      = "ListBucket",
        Effect   = "Allow",
        Action   = ["s3:ListBucket"],
        Resource = "${aws_s3_bucket.assets.arn}"
      },
      {
        Sid    = "WriteObjects",
        Effect = "Allow",
        Action = [
          "s3:PutObject",
          "s3:AbortMultipartUpload",
          "s3:PutObjectTagging"
        ],
        Resource  = "${aws_s3_bucket.assets.arn}/*",
        Condition = { Bool = { "aws:SecureTransport" : true } }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_s3_upload" {
  role       = aws_iam_role.ssm_role.name
  policy_arn = aws_iam_policy.s3_upload_policy.arn
}

###############################################
# IAM Policy that allows sending emails via SES
###############################################
resource "aws_iam_policy" "ec2_ses_policy" {
  name        = "ec2-ses-send-email-policy"
  description = "Allow EC2 instances to send emails using SES"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ]
        Resource = "*"
      }
    ]
  })
}

###############################################
# Attach policy to role
###############################################

resource "aws_iam_role_policy_attachment" "ec2_ses_attach" {
  role       = aws_iam_role.ssm_role.name
  policy_arn = aws_iam_policy.ec2_ses_policy.arn
}
