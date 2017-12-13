# coding: utf-8
class LodgesController < AuthorizedController
  helper_method :sort_column, :sort_direction

  load_and_authorize_resource :find_by => :slug
  
  def index
    flash.now[:error] = "Lodgen können nicht erstellt werden, weil keine Distrikte angelegt sind." if District.undeleted.empty?
  end

  def show
    @officers = view_context.get_authorized_paginated(@lodge.officers.order(sort_column + " " + sort_direction)).page(params[:page])
  end

  def new
    redirect_to lodges_path if District.undeleted.empty?
  end

  def create
    if @lodge.save
      redirect_to @lodge, notice: t("activerecord.create_success", model: t("activerecord.models.lodge"))
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @lodge.update_attributes(params[:lodge])
      redirect_to @lodge, notice: t("activerecord.update_success", model: t("activerecord.models.lodge"))
    else
      render :edit
    end
  end

  def destroy
    @lodge.deleted = true
    @lodge.save
    redirect_to lodges_url, notice: t("activerecord.destroy_success", model: t("activerecord.models.lodge"))
  end

  private
  
  def sort_column
    (Officer.column_names).include?(params[:sort_by]) ? params[:sort_by] : "lastname"
  end

  def lodge_params
    params.require(:lodge).permit(:lodge,
                                  :district_id,
                                  :name,
                                  :description
                                 )
  end
  
end
