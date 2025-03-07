  def update
    if @<%= instance_name %>.update_attributes(params[:<%= instance_name %>])
      redirect_to <%= item_url %>, notice: t("activerecord.update_success", model: t("activerecord.models.<%= class_name.underscore %>"))
    else
      render :edit
    end
  end
