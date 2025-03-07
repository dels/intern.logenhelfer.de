class AcademicTitlesController < AuthorizedController

  def create
    if @academic_title.save
      redirect_to app_config_url, notice: t("activerecord.create_success", model: t("activerecord.models.academic_title"))
    else
      redirect_to app_config_url, error: t("activerecord.create_failure", model: t("activerecord.models.academic_title"))
    end
  end

  def update
    respond_to do |format|
      format.json {
        @academic_title.update_attributes params[:academic_title]
        respond_with_bip @academic_title
      }
    end
  end

  def destroy
    if @academic_title.users.count > 0
      redirect_to app_config_url, notice: t("activerecord.destroy_failure", model: t("activerecord.models.academic_title"))
    else
      @academic_title.destroy
      redirect_to app_config_url, notice: t("activerecord.destroy_success", model: t("activerecord.models.academic_title"))
    end
  end

end
