
class SeekersController < AuthorizedController
  helper_method :sort_column, :sort_direction
  load_and_authorize_resource :find_by => :uuid
  
  def index
    @seekers = view_context.get_authorized_paginated(@seekers.where("status <> ? AND status <> ?", Seeker::STATUS[:declined], Seeker::STATUS[:accepted]).where(invite: true).order(sort_column + " " + sort_direction)).page(params[:page])
  end

  def show
  end

  def new
    @seeker.invite = true
    @seeker.address.type_of_address = Address::TYPES[:private]
    @seeker.address.purpose = t("activerecord.address.private")
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
    @seekers = view_context.get_authorized_paginated(@seekers.where(status: Seeker::STATUS[:accepted]).order(sort_column + " " + sort_direction)).page(params[:page])
  end

  def inactive
    @seekers = view_context.get_authorized_paginated(@seekers.where(invite: false).where("status <> ? AND status <> ?", Seeker::STATUS[:declined], Seeker::STATUS[:accepted]).order(sort_column + " " + sort_direction)).page(params[:page])
  end

  def declined
    @seekers = view_context.get_authorized_paginated(@seekers.where(status: Seeker::STATUS[:declined]).order(sort_column + " " + sort_direction)).page(params[:page])
  end

  private

  def sort_column
    (Seeker.column_names).include?(params[:sort_by]) ? params[:sort_by] : "lastname ASC, firstname"
  end

  def seeker_params
    params.require(:seeker).permit(:firstname,
                                   :lastname,
                                   :source,
                                   :status,
                                   :invite,
                                   :preferred_way_of_contact,
                                   :notes,
                                   { address_attributes: [:id,
                                                          :type_of_address,
                                                          :purpose,
                                                          :street1,
                                                          :street2,
                                                          :street3,
                                                          :zip,
                                                          :city,
                                                          :phone,
                                                          :fax,
                                                          :mobile,
                                                          :email,
                                                          :remarks,
                                                          :_destroy
                                                         ]}
                                  )
  end

end
