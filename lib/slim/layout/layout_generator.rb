require 'generators/slim'

module Slim
  module Generators
    class LayoutGenerator < Base
      argument :layout_name, :type => :string, :default => 'application', :banner => 'layout_name'

      def create_layout
        template 'layout.html.erb', "app/views/layouts/#{file_name}.html.erb"
        copy_file 'stylesheet.css', "app/assets/stylesheets/#{file_name}.css"

        copy_file 'layout_helper.rb', 'app/helpers/layout_helper.rb'
        copy_file 'definite_form_builder.rb', 'lib/definite_form_builder.rb'

        for img in %w[all config csv destroy edit groups logout news rate roles show star unread users] do
          copy_file "public/images/#{img}.png", "app/assets/images/#{img}.png"
        end

        inject_into_class 'app/controllers/application_controller.rb', ApplicationController do
          "  helper :layout\n"
        end
      end

      private

      def file_name
        layout_name.underscore
      end
    end
  end
end
