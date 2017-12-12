class StaticsController < ApplicationController
  before_action :authenticate_user!, :except => [:index, :impressum, :robots_txt]

  respond_to :html, :text

  def index
    unless request.path.eql?("/anmelden")
      if(ActiveModel::Type::Boolean.new.cast(AppConfig[:working_plan_as_start_page]) && ActiveModel::Type::Boolean.new.cast(AppConfig[:public_wp_available_to_anon_users]))
        redirect_to calendar_export_url
      end
    end
    @announcements = Announcement.page(params[:page]).per(5)
  end

  def impressum
  end

  def robots_txt
    render 'robots_txt', :content_type => "text/plain", :layout => false
  end

end
