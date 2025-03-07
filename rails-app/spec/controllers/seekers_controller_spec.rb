require File.dirname(__FILE__) + '/../spec_helper'

describe SeekersController do
  fixtures :all
  render_views

  it "index action should render index template" do
    get :index
    response.should render_template(:index)
  end

  it "show action should render show template" do
    get :show, :id => Seeker.first
    response.should render_template(:show)
  end

  it "new action should render new template" do
    get :new
    response.should render_template(:new)
  end

  it "create action should render new template when model is invalid" do
    Seeker.any_instance.stubs(:valid?).returns(false)
    post :create
    response.should render_template(:new)
  end

  it "create action should redirect when model is valid" do
    Seeker.any_instance.stubs(:valid?).returns(true)
    post :create
    response.should redirect_to(seeker_url(assigns[:seeker]))
  end

  it "edit action should render edit template" do
    get :edit, :id => Seeker.first
    response.should render_template(:edit)
  end

  it "update action should render edit template when model is invalid" do
    Seeker.any_instance.stubs(:valid?).returns(false)
    put :update, :id => Seeker.first
    response.should render_template(:edit)
  end

  it "update action should redirect when model is valid" do
    Seeker.any_instance.stubs(:valid?).returns(true)
    put :update, :id => Seeker.first
    response.should redirect_to(seeker_url(assigns[:seeker]))
  end

  it "destroy action should destroy model and redirect to index action" do
    seeker = Seeker.first
    delete :destroy, :id => seeker
    response.should redirect_to(seekers_url)
    Seeker.exists?(seeker.id).should be_false
  end
end
