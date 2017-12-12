class StaticsController < ApplicationController
  before_action :authenticate_user!, :except => [:index, :impressum, :robots_txt]

  respond_to :html, :text

  def index
    begin
      user_signed_in?
    rescue
      redirect_to destroy_user_session_path
    end
    unless request.path.eql?("/anmelden")
      # FIXME: MUST BE TO bool
      if AppConfig[:working_plan_as_start_page].eql?("t") && AppConfig[:public_wp_available_to_anon_users].eql?("t")
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
