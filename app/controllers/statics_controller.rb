class StaticsController < ApplicationController
  before_filter :authenticate_user!, :except => [:index, :impressum]

  def index
  end

  def impressum
  end

  def overview
    @start_date, @end_date = get_safe_start_end_date(params[:start_date], params[:end_date])
    redirect_to tasks_path if current_user.acts_like? :FacilityManager
  end

end
