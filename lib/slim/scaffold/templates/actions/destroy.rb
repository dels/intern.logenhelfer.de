  def destroy
    @<%= instance_name %>.deleted = true
    @<%= instance_name %>.save
    redirect_to <%= items_url %>, notice: t("activerecord.destroy_success", model: t("activerecord.models.<%= class_name.underscore %>"))
  end
