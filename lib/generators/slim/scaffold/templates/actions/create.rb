  def create
    if @<%= instance_name %>.save
      redirect_to <%= item_url %>, notice: t("activerecord.create_success", model: t("activerecord.models.<%= class_name.underscore %>"))
    else
      render :new
    end
  end
