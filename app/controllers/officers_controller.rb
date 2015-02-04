class OfficersController < AuthorizedController

  def show
  end

  def new
    @officer.lodge = Lodge.find(params[:lodge_id])
  end

  def create
    @officer.lodge = Lodge.find(params[:lodge_id])
    unless can?(:create, Officer)
      redirect_to root_url, :alert => t("devise.error.access_denied")
    end
    if @officer.save
      redirect_to @officer.lodge, notice: t("activerecord.create_success", model: t("activerecord.models.officer"))
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @officer.update_attributes(params[:officer])
      redirect_to @officer.lodge, notice: t("activerecord.update_success", model: t("activerecord.models.officer"))
    else
      render :edit
    end
  end

  def destroy
    @officer.deleted = true
    @officer.save
    redirect_to lodges_url(@officer.lodge), notice: t("activerecord.destroy_success", model: t("activerecord.models.officer"))
  end
end
