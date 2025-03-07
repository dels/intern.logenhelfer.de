class RolesController < AuthorizedController
  helper_method :sort_column, :sort_direction

  load_and_authorize_resource
  
  def index
    sort_column ||= 'display_name'
    @roles = view_context.get_authorized_paginated(Role.where(:administrational_role => false).order(sort_column + " " + sort_direction)).page(params[:page])
  end

  def edit
  end

  def update
    [
     :display_name, :administrational_group, :group, :name, :description
    ].each do |attribute|
      params[:role].delete(attribute)
    end
    if @role.update_attributes(params[:role])
      redirect_to roles_path, notice: t("activerecord.update_success", model: t("activerecord.models.role"))
    else
      render :edit
    end
  end

private
  def sort_column
    (Role.column_names).include?(params[:sort_by]) ? params[:sort_by] : "display_name ASC"
  end

  def role_params
    params.require(:role).permit(:role,
                                 :email,
                                 :display_name
    )
    
  end
  
end
