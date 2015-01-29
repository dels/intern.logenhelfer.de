class SeekersController < AuthorizedController
#  helper_method :sort_column, :sort_direction

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

  def accepted
    @seekers = view_context.get_authorized_paginated(Seeker.where(:status => Seeker::STATUS[:accepted]).order(sort_column + " " + sort_direction)).page(params[:page])
  end

  def declined
    @seekers = view_context.get_authorized_paginated(Seeker.where(:status => Seeker::STATUS[:declined]).order(sort_column + " " + sort_direction)).page(params[:page])

  end

  private

  def sort_column
    (Seeker.column_names).include?(params[:sort_by]) ? params[:sort_by] : "lastname ASC, firstname"
  end

end
