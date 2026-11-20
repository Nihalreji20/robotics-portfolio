$ErrorActionPreference = 'Stop'

Set-Location $PSScriptRoot
node build.mjs
Start-Process 'http://127.0.0.1:4173/'
node serve.mjs
