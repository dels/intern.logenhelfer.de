class DistrictsController < AuthorizedController

  def create
    if @district.save
      redirect_to  app_config_url, notice: t("activerecord.create_success", model: t("activerecord.models.district"))
    else
      render :new
    end
  end

  def update
    respond_to do |format|
      format.json {
        @district.update_attributes params[:district]
        respond_with_bip @district
      }
    end
  end

  def destroy
    @district.deleted = true
    @district.save
    redirect_to app_config_url, notice: t("activerecord.destroy_success", model: t("activerecord.models.district"))
  end
end
