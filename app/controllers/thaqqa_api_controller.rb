class ThaqqaApiController < ApplicationController
  def render_svg
    res = Faraday.post("#{ENV.fetch("THAQQA_API_URL")}/thaqqa/render/as_path_d") do |req|
      req.headers["Content-Type"] = "application/json"
      req.body = request.raw_post
    end

    render json: JSON.parse(res.body), status: res.status
  end

  def get_prefab
    token = cookies.encrypted[:thaqqa_token]
        
    res = Faraday.post("#{ENV.fetch("THAQQA_API_URL")}/thaqqa/prefab/get") do |req|
      req.headers["Content-Type"] = "application/json"
      req.headers["Authorization"] = "Bearer #{token}"
      req.body = request.raw_post
      
    end

    render json: JSON.parse(res.body), status: res.status
  end

  def add_data_into_prefab
    token = cookies.encrypted[:thaqqa_token]
        
    res = Faraday.post("#{ENV.fetch("THAQQA_API_URL")}/thaqqa/prefab/data/new") do |req|
      req.headers["Content-Type"] = "application/json"
      req.headers["Authorization"] = "Bearer #{token}"
      req.body = request.raw_post
      
    end

    render json: JSON.parse(res.body), status: res.status
  end

  def update_prefab
    token = cookies.encrypted[:thaqqa_token]
        
    res = Faraday.post("#{ENV.fetch("THAQQA_API_URL")}/thaqqa/prefab/data/update") do |req|
      req.headers["Content-Type"] = "application/json"
      req.headers["Authorization"] = "Bearer #{token}"
      req.body = request.raw_post
    end

    render json: JSON.parse(res.body), status: res.status
  end


  def delete_data_from_prefab
    token = cookies.encrypted[:thaqqa_token]
        
    res = Faraday.post("#{ENV.fetch("THAQQA_API_URL")}/thaqqa/prefab/data/delete") do |req|
      req.headers["Content-Type"] = "application/json"
      req.headers["Authorization"] = "Bearer #{token}"
      req.body = request.raw_post
    end

    render json: JSON.parse(res.body), status: res.status
  end

  
  
end