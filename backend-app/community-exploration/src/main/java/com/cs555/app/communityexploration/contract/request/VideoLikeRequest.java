package com.cs555.app.communityexploration.contract.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * @author Himanshu Dagar
 *
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class VideoLikeRequest {

	private int userId;
	
	private int videoId;
	
	/**
	 * @return the userId
	 */
	public int getUserId() {
		return userId;
	}

	/**
	 * @param userId the userId to set
	 */
	public void setUserId(int userId) {
		this.userId = userId;
	}

	/**
	 * @return the videoId
	 */
	public int getVideoId() {
		return videoId;
	}

	/**
	 * @param videoId the videoId to set
	 */
	public void setVideoId(int videoId) {
		this.videoId = videoId;
	}

	@Override
	public String toString() {
		return "VideoLikeRequest [userId=" + userId + ", videoId=" + videoId + "]";
	}

}
