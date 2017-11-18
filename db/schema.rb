# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20171118170242) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "academic_titles", force: :cascade do |t|
    t.string   "title"
    t.string   "short"
    t.boolean  "deleted",    default: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "academic_titles", ["short"], name: "index_academic_titles_on_short", unique: true, using: :btree
  add_index "academic_titles", ["title"], name: "index_academic_titles_on_title", unique: true, using: :btree

  create_table "addresses", force: :cascade do |t|
    t.integer  "addressable_id"
    t.string   "addressable_type"
    t.string   "purpose"
    t.string   "street1"
    t.string   "street2"
    t.string   "street3"
    t.string   "zip"
    t.string   "city"
    t.string   "phone"
    t.string   "fax"
    t.string   "email"
    t.text     "remarks"
    t.boolean  "deleted",          default: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "type_of_address"
    t.string   "mobile"
  end

  create_table "announcement_subscriptions", force: :cascade do |t|
    t.integer  "user_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "announcement_subscriptions", ["user_id"], name: "index_announcement_subscriptions_on_user_id", using: :btree

  create_table "announcements", force: :cascade do |t|
    t.string   "uuid"
    t.string   "title"
    t.text     "message_body"
    t.integer  "created_by_id"
    t.integer  "updated_by_id"
    t.boolean  "deleted",       default: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "app_config_adapters", force: :cascade do |t|
    t.string "key"
    t.text   "value"
  end

  add_index "app_config_adapters", ["key"], name: "index_app_config_adapters_on_key", unique: true, using: :btree

  create_table "attached_file_roles", force: :cascade do |t|
    t.integer  "attached_file_id"
    t.integer  "role_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "attached_file_roles", ["attached_file_id"], name: "index_attached_file_roles_on_attached_file_id", using: :btree
  add_index "attached_file_roles", ["role_id"], name: "index_attached_file_roles_on_role_id", using: :btree

  create_table "attached_files", force: :cascade do |t|
    t.string   "uuid",           limit: 36
    t.string   "filename"
    t.binary   "content"
    t.string   "content_type"
    t.integer  "directory_id"
    t.integer  "uploader_id"
    t.boolean  "deleted",                   default: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "content_length",            default: -1
  end

  add_index "attached_files", ["deleted"], name: "index_attached_files_on_deleted", using: :btree
  add_index "attached_files", ["directory_id"], name: "index_attached_files_on_directory_id", using: :btree
  add_index "attached_files", ["filename"], name: "index_attached_files_on_filename", using: :btree

  create_table "categories", force: :cascade do |t|
    t.string   "name"
    t.text     "description"
    t.boolean  "deleted",     default: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "slug"
  end

  add_index "categories", ["slug"], name: "index_categories_on_slug", using: :btree

  create_table "category_roles", force: :cascade do |t|
    t.integer  "category_id"
    t.integer  "role_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "category_roles", ["category_id"], name: "index_category_roles_on_category_id", using: :btree
  add_index "category_roles", ["role_id"], name: "index_category_roles_on_role_id", using: :btree

  create_table "directories", force: :cascade do |t|
    t.string   "name"
    t.text     "description"
    t.integer  "category_id"
    t.boolean  "deleted",     default: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "slug"
  end

  add_index "directories", ["category_id"], name: "index_directories_on_category_id", using: :btree
  add_index "directories", ["deleted"], name: "index_directories_on_deleted", using: :btree
  add_index "directories", ["slug"], name: "index_directories_on_slug", using: :btree

  create_table "directory_roles", force: :cascade do |t|
    t.integer  "directory_id"
    t.integer  "role_id"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  add_index "directory_roles", ["directory_id"], name: "index_directory_roles_on_directory_id", using: :btree
  add_index "directory_roles", ["role_id"], name: "index_directory_roles_on_role_id", using: :btree

  create_table "districts", force: :cascade do |t|
    t.string   "slug"
    t.string   "name"
    t.boolean  "deleted",    default: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "events", force: :cascade do |t|
    t.string   "title"
    t.text     "public_description"
    t.text     "private_description"
    t.boolean  "whole_day"
    t.integer  "created_by_id"
    t.integer  "updated_by_id"
    t.boolean  "deleted",                        default: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.date     "date",                                           null: false
    t.time     "time",                                           null: false
    t.string   "uuid",                limit: 36
    t.string   "location"
  end

  add_index "events", ["created_by_id"], name: "index_events_on_created_by_id", using: :btree
  add_index "events", ["updated_by_id"], name: "index_events_on_updated_by_id", using: :btree

  create_table "external_event_participants", force: :cascade do |t|
    t.integer  "user_id"
    t.integer  "external_event_id"
    t.boolean  "subscription_sent", default: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.boolean  "festive_board",     default: false
  end

  create_table "external_events", force: :cascade do |t|
    t.string   "uuid"
    t.string   "title",                         null: false
    t.text     "description"
    t.string   "location",                      null: false
    t.time     "time",                          null: false
    t.date     "date",                          null: false
    t.integer  "created_by_id",                 null: false
    t.integer  "updated_by_id"
    t.boolean  "deleted",       default: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "host"
  end

  create_table "file_downloads", force: :cascade do |t|
    t.integer  "attached_file_id"
    t.integer  "user_id"
    t.string   "remote_ip"
    t.boolean  "deleted",          default: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "filename"
  end

  add_index "file_downloads", ["deleted"], name: "index_file_downloads_on_deleted", using: :btree
  add_index "file_downloads", ["user_id"], name: "index_file_downloads_on_user_id", using: :btree

  create_table "friendly_id_slugs", force: :cascade do |t|
    t.string   "slug",                      null: false
    t.integer  "sluggable_id",              null: false
    t.string   "sluggable_type", limit: 50
    t.string   "scope"
    t.datetime "created_at"
  end

  add_index "friendly_id_slugs", ["slug", "sluggable_type", "scope"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type_and_scope", unique: true, using: :btree
  add_index "friendly_id_slugs", ["slug", "sluggable_type"], name: "index_friendly_id_slugs_on_slug_and_sluggable_type", using: :btree
  add_index "friendly_id_slugs", ["sluggable_id"], name: "index_friendly_id_slugs_on_sluggable_id", using: :btree
  add_index "friendly_id_slugs", ["sluggable_type"], name: "index_friendly_id_slugs_on_sluggable_type", using: :btree

  create_table "lodges", force: :cascade do |t|
    t.string   "slug"
    t.string   "name"
    t.text     "description"
    t.integer  "district_id"
    t.boolean  "deleted",     default: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "officers", force: :cascade do |t|
    t.string   "uuid"
    t.integer  "lodge_id"
    t.string   "firstname"
    t.string   "lastname"
    t.integer  "role_id"
    t.string   "role_email"
    t.boolean  "deleted",    default: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "roles", force: :cascade do |t|
    t.string   "name"
    t.string   "description"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "display_name"
    t.boolean  "group",                 default: false
    t.boolean  "administrational_role", default: true
    t.string   "email"
    t.integer  "ordering_number"
  end

  create_table "seekers", force: :cascade do |t|
    t.string   "firstname"
    t.string   "lastname"
    t.string   "source"
    t.boolean  "invite"
    t.boolean  "deleted",                             default: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "uuid",                     limit: 36
    t.integer  "preferred_way_of_contact"
    t.integer  "status"
    t.text     "notes"
  end

  create_table "user_roles", force: :cascade do |t|
    t.integer  "user_id"
    t.integer  "role_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.date     "role_added_at"
  end

  create_table "users", force: :cascade do |t|
    t.string   "email",                  default: "",    null: false
    t.string   "encrypted_password",     default: "",    null: false
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          default: 0
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "uuid"
    t.string   "firstname"
    t.string   "lastname"
    t.date     "date_of_birth"
    t.date     "accepted_at"
    t.boolean  "deleted",                default: false
    t.integer  "matriculation_number"
    t.string   "job_title"
    t.integer  "title"
    t.integer  "academic_title_id"
    t.string   "mother_lodge"
    t.string   "provider"
    t.string   "g_uid"
    t.string   "g_name"
    t.string   "g_mail"
    t.string   "oauth_token"
    t.datetime "oauth_expires_at"
  end

  add_index "users", ["email"], name: "index_users_on_email", unique: true, using: :btree
  add_index "users", ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true, using: :btree

end
