class CategoriesController < AuthorizedController

  def index
    @categories = view_context.get_authorized(@categories.order(:name))
  end

  def show
    @directories = view_context.get_authorized(@category.directories.order(:name))
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
    @category.deleted = true
    @category.save
    redirect_to categories_url, notice: t("activerecord.destroy_success", model: t("activerecord.models.category"))
  end

end
