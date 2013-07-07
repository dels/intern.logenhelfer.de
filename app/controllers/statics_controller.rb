class StaticsController < ApplicationController
  before_filter :authenticate_user!, :except => [:index, :impressum, :robots_txt]

  respond_to :html, :text

  def index
    @announcements = Announcement.page(params[:page]).per(5)
  end

  def impressum
  end

  def robots_txt
    render 'robots_txt', :content_type => "text/plain", :layout => false
  end

end
