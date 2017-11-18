class StaticsController < ApplicationController
  before_filter :authenticate_user!, :except => [:index, :impressum, :robots_txt]

  respond_to :html, :text

  def index
    unless request.path.eql?("/anmelden")
      Rails.logger.error("##### #{AppConfig[:working_plan_as_start_page]} #{AppConfig[:public_wp_available_to_anon_users]}")
      if AppConfig[:working_plan_as_start_page].eql?("t") && AppConfig[:public_wp_available_to_anon_users].eql?("t")
        Rails.logger.error ("REDIRECTING!!!!!")
        redirect_to calendar_export_url
      end
      Rails.logger.error ("NOT     REDIRECTING!!!!!")
    end
    @announcements = Announcement.page(params[:page]).per(5)
  end

  def impressum
  end

  def robots_txt
    render 'robots_txt', :content_type => "text/plain", :layout => false
  end

end
