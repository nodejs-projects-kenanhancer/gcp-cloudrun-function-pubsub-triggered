output "function_configs" {
  value = {
    for name, function in module.functions : name => function.function_config
  }
}
