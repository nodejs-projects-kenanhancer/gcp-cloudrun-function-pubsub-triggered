data "terraform_remote_state" "shared_resources" {
  backend = "gcs"
  config = {
    bucket         = "${var.basic_config.tf_state_bucket}-${var.basic_config.gcp_project_id}"
    prefix         = var.basic_config.tf_state_prefix_for_shared_resources
    encryption_key = var.basic_config.tf_encryption_key
  }
}

data "terraform_remote_state" "github_actions_resources" {
  backend = "gcs"
  config = {
    bucket         = "${var.basic_config.tf_state_bucket}-${var.basic_config.gcp_project_id}"
    prefix         = var.basic_config.tf_state_prefix_for_github_actions_resources
    encryption_key = var.basic_config.tf_encryption_key
  }
}

module "storage_buckets" {
  source   = "./modules/storage"
  for_each = var.storages

  basic_config  = var.basic_config
  bucket_config = each.value
}

module "functions" {
  source   = "./modules/function"
  for_each = var.functions

  basic_config = var.basic_config
  function_config = merge(each.value, {
    source_bucket                    = data.terraform_remote_state.shared_resources.outputs.storage_resources.result.buckets.cloud_function_source.bucket_name
    run_time_service_account_email   = data.terraform_remote_state.shared_resources.outputs.iam_resources.result.service_accounts.cloud_function.email
    build_time_service_account_email = data.terraform_remote_state.github_actions_resources.outputs.formatted_service_account
  })
}
