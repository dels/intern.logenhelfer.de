require File.dirname(__FILE__) + '/../spec_helper'

describe ExternalEventsController do
  fixtures :all
  render_views

  it "index action should render index template" do
    get :index
    response.should render_template(:index)
  end

  it "show action should render show template" do
    get :show, :id => ExternalEvent.first
    response.should render_template(:show)
  end

  it "new action should render new template" do
    get :new
    response.should render_template(:new)
  end

  it "create action should render new template when model is invalid" do
    ExternalEvent.any_instance.stubs(:valid?).returns(false)
    post :create
    response.should render_template(:new)
  end

  it "create action should redirect when model is valid" do
    ExternalEvent.any_instance.stubs(:valid?).returns(true)
    post :create
    response.should redirect_to(external_event_url(assigns[:external_event]))
  end

  it "edit action should render edit template" do
    get :edit, :id => ExternalEvent.first
    response.should render_template(:edit)
  end

  it "update action should render edit template when model is invalid" do
    ExternalEvent.any_instance.stubs(:valid?).returns(false)
    put :update, :id => ExternalEvent.first
    response.should render_template(:edit)
  end

  it "update action should redirect when model is valid" do
    ExternalEvent.any_instance.stubs(:valid?).returns(true)
    put :update, :id => ExternalEvent.first
    response.should redirect_to(external_event_url(assigns[:external_event]))
  end

  it "destroy action should destroy model and redirect to index action" do
    external_event = ExternalEvent.first
    delete :destroy, :id => external_event
    response.should redirect_to(external_events_url)
    ExternalEvent.exists?(external_event.id).should be_false
  end
end
