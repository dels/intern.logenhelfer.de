APP_VERSION = {
  :major => 0,
  :minor => 1,
  :patch => `git log -n1 --date=short --pretty=format:"%h"`.chomp,
  :deployed_at => `git log -n1 --date=short --pretty=format:"%ad."`.chomp
}.freeze

APP_VERSION_STRING = [APP_VERSION[:major], APP_VERSION[:minor], APP_VERSION[:patch]].join('.').freeze

