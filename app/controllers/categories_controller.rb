class CategoriesController < AuthorizedController
  helper_method :sort_column, :sort_direction
  
  load_and_authorize_resource :find_by => :slug
  
  def index
    @categories = view_context.get_authorized_paginated(@categories.order(:name)).page(params[:page])
  end

  def show
    @directories = view_context.get_authorized_paginated(@category.directories.order(sort_column + " " + sort_direction)).page(params[:page])
  end

  def new
  end

  def create
    if @category.save
      redirect_to @category, notice: t("activerecord.create_success", model: t("activerecord.models.category"))
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @category.update_attributes(params[:category])
      redirect_to @category, notice: t("activerecord.update_success", model: t("activerecord.models.category"))
    else
      render :edit
    end
  end

  def destroy
    @category.delete
    redirect_to categories_url, notice: t("activerecord.destroy_success", model: t("activerecord.models.category"))
  end

  private

  def sort_column
    (Directory.column_names).include?(params[:sort_by]) ? params[:sort_by] : "name"
  end

  def category_params
    params.require(:category).permit({:role_ids => [] },
                                     :name,
                                     :description
                                    )
  end

  

end
