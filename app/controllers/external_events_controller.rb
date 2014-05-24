# -*- coding: utf-8 -*-

class ExternalEventsController < AuthorizedController

  def index
  end

  def show
  end

  def new
  end

  def create
    @external_event.created_by_id = current_user.id
    if @external_event.save
      redirect_to @external_event, notice: t("activerecord.create_success", model: t("activerecord.models.external_event"))
    else
      render :new
    end
  end

  def edit
  end

  def update
    if @external_event.update_attributes(params[:external_event])
      redirect_to @external_event, notice: t("activerecord.update_success", model: t("activerecord.models.external_event"))
    else
      render :edit
    end
  end

  def destroy
    @external_event.deleted = true
    @external_event.save
    redirect_to external_events_url, notice: t("activerecord.destroy_success", model: t("activerecord.models.external_event"))
  end
end
