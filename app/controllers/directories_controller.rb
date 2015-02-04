class DirectoriesController < AuthorizedController
  helper_method :sort_column, :sort_direction
  
  def show
    @attached_files = view_context.get_authorized_paginated(@directory.attached_files.order(sort_column + " " + sort_direction).select('id, filename, directory_id, uuid, content_length')).page(params[:page])
  end

  def new
    @directory.category = Category.find(params[:category_id])
    @directory.role_ids = @directory.category.role_ids
  end

  def create
    @directory.category = Category.find(params[:category_id])
    if @directory.save
      redirect_to [@directory.category, @directory], notice: t("activerecord.create_success", model: t("activerecord.models.directory"))
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @directory.update_attributes(params[:directory])
      redirect_to [@directory.category, @directory], notice: t("activerecord.update_success", model: t("activerecord.models.directory"))
    else
      render :edit
    end
  end

  def destroy
    @directory.delete
    redirect_to @directory.category, notice: t("activerecord.destroy_success", model: t("activerecord.models.directory"))
  end

  private
  
  def sort_column
    (AttachedFile.column_names).include?(params[:sort_by]) ? params[:sort_by] : "filename"
  end
end
