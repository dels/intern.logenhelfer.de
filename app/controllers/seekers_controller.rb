class SeekersController < ApplicationController
  load_and_authorize_resource

  def index
  end

  def show
  end

  def new
  end

  def create
    if @seeker.save
      redirect_to @seeker, notice: t("activerecord.create_success", model: t("activerecord.models.seeker"))
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @seeker.update_attributes(params[:seeker])
      redirect_to @seeker, notice: t("activerecord.update_success", model: t("activerecord.models.seeker"))
    else
      render :edit
    end
  end

  def destroy
    @seeker.deleted = true
    @seeker.save
    redirect_to seekers_url, notice: t("activerecord.destroy_success", model: t("activerecord.models.seeker"))
  end
end
