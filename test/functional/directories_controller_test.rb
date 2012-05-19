require 'test_helper'

class DirectoriesControllerTest < ActionController::TestCase
  def test_index
    get :index
    assert_template 'index'
  end

  def test_show
    get :show, :id => Directory.first
    assert_template 'show'
  end

  def test_new
    get :new
    assert_template 'new'
  end

  def test_create_invalid
    Directory.any_instance.stubs(:valid?).returns(false)
    post :create
    assert_template 'new'
  end

  def test_create_valid
    Directory.any_instance.stubs(:valid?).returns(true)
    post :create
    assert_redirected_to directory_url(assigns(:directory))
  end

  def test_edit
    get :edit, :id => Directory.first
    assert_template 'edit'
  end

  def test_update_invalid
    Directory.any_instance.stubs(:valid?).returns(false)
    put :update, :id => Directory.first
    assert_template 'edit'
  end

  def test_update_valid
    Directory.any_instance.stubs(:valid?).returns(true)
    put :update, :id => Directory.first
    assert_redirected_to directory_url(assigns(:directory))
  end

  def test_destroy
    directory = Directory.first
    delete :destroy, :id => directory
    assert_redirected_to directories_url
    assert !Directory.exists?(directory.id)
  end
end
