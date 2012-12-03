class AppConfigController < ApplicationController
  before_filter :authenticate_user!

  def index
    @config_keys = AppConfig.keys
    @academic_titles = AcademicTitle.undeleted.all
  end

  def update
    AppConfig.update params[:app_config]
    redirect_to app_config_url, notice: I18n.t('.activerecord.update_success')
  end
end