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

  def update_prefab
    token = cookies.encrypted[:thaqqa_token]
        
    res = Faraday.post("#{ENV.fetch("THAQQA_API_URL")}/thaqqa/prefab/data/update") do |req|
      req.headers["Content-Type"] = "application/json"
      req.headers["Authorization"] = "Bearer #{token}"
      req.body = request.raw_post
    end

    render json: JSON.parse(res.body), status: res.status
  end


  
  
end