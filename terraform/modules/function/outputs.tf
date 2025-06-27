output "function_deployment_name" {
  value = google_cloudfunctions2_function.function.name
}

output "function_trigger_url" {
  value = google_cloudfunctions2_function.function.url
}

output "object_name" {
  value = google_storage_bucket_object.function_archive.name
}

output "function_config" {
  value = {
    build_time_sa = var.function_config.build_time_service_account_email
    run_time_sa   = var.function_config.run_time_service_account_email
    source_bucket = var.function_config.source_bucket
  }
}
