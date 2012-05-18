class <%= plural_class_name %>Controller < ApplicationController
  load_and_authorize_resource

  <%= controller_methods :actions %>
end
