class DirectoriesController < ApplicationController
  load_and_authorize_resource

  def index
  end

  def show
  end

  def new
  end

  def create
    if @directory.save
      redirect_to @directory, notice: t("activerecord.create_success", model: t("activerecord.models.directory"))
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @directory.update_attributes(params[:directory])
      redirect_to @directory, notice: t("activerecord.update_success", model: t("activerecord.models.directory"))
    else
      render :edit
    end
  end

  def destroy
    @directory.deleted = true
    @directory.save
    redirect_to directories_url, notice: t("activerecord.destroy_success", model: t("activerecord.models.directory"))
  end
end
