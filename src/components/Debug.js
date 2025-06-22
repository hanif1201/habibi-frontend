import React, { useState } from "react";
import axios from "axios";

const Debug = () => {
  const [cloudinaryTest, setCloudinaryTest] = useState(null);
  const [envTest, setEnvTest] = useState(null);
  const [matchingTest, setMatchingTest] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const testCloudinary = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/debug/cloudinary`);
      setCloudinaryTest(response.data);
    } catch (error) {
      setCloudinaryTest({
        success: false,
        error: error.response?.data || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const testEnv = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/debug/env`);
      setEnvTest(response.data);
    } catch (error) {
      setEnvTest({
        success: false,
        error: error.response?.data || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const testMatching = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/debug/matching`);
      setMatchingTest(response.data);
    } catch (error) {
      setMatchingTest({
        success: false,
        error: error.response?.data || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='max-w-6xl mx-auto p-6'>
      <h2 className='text-2xl font-bold mb-6'>Debug Dashboard</h2>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Environment Variables Test */}
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-semibold mb-4'>Environment Variables</h3>
          <button
            onClick={testEnv}
            disabled={loading}
            className='bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mb-4'
          >
            {loading ? "Testing..." : "Test Environment"}
          </button>

          {envTest && (
            <div className='bg-gray-50 p-4 rounded'>
              <pre className='text-sm overflow-auto'>
                {JSON.stringify(envTest, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Cloudinary Test */}
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-semibold mb-4'>Cloudinary Connection</h3>
          <button
            onClick={testCloudinary}
            disabled={loading}
            className='bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 mb-4'
          >
            {loading ? "Testing..." : "Test Cloudinary"}
          </button>

          {cloudinaryTest && (
            <div className='bg-gray-50 p-4 rounded'>
              <div
                className={`mb-2 font-semibold ${
                  cloudinaryTest.success ? "text-green-600" : "text-red-600"
                }`}
              >
                {cloudinaryTest.success ? "SUCCESS" : "FAILED"}
              </div>
              <pre className='text-sm overflow-auto'>
                {JSON.stringify(cloudinaryTest, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Matching System Test */}
        <div className='bg-white rounded-lg shadow p-6'>
          <h3 className='text-lg font-semibold mb-4'>Matching System</h3>
          <button
            onClick={testMatching}
            disabled={loading}
            className='bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 mb-4'
          >
            {loading ? "Testing..." : "Test Matching"}
          </button>

          {matchingTest && (
            <div className='bg-gray-50 p-4 rounded'>
              <div
                className={`mb-2 font-semibold ${
                  matchingTest.success ? "text-green-600" : "text-red-600"
                }`}
              >
                {matchingTest.success ? "SUCCESS" : "FAILED"}
              </div>
              <pre className='text-sm overflow-auto'>
                {JSON.stringify(matchingTest, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Simple Upload Test */}
      <div className='bg-white rounded-lg shadow p-6 mt-6'>
        <h3 className='text-lg font-semibold mb-4'>Simple Upload Test</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const fileInput = e.target.photo;
            if (!fileInput.files[0]) {
              alert("Please select a file");
              return;
            }

            const formData = new FormData();
            formData.append("photo", fileInput.files[0]);

            try {
              setLoading(true);
              const response = await axios.post(
                `${API_URL}/photos/upload`,
                formData,
                {
                  headers: {
                    "Content-Type": "multipart/form-data",
                  },
                }
              );
              alert("Upload successful!");
              console.log("Upload response:", response.data);
            } catch (error) {
              alert(
                "Upload failed: " +
                  (error.response?.data?.message || error.message)
              );
              console.error("Upload error:", error);
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Select Image File
            </label>
            <input
              type='file'
              name='photo'
              accept='image/*'
              className='w-full p-2 border border-gray-300 rounded'
            />
          </div>
          <button
            type='submit'
            disabled={loading}
            className='bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50'
          >
            {loading ? "Uploading..." : "Test Upload"}
          </button>
        </form>
      </div>

      {/* API Tests */}
      <div className='bg-white rounded-lg shadow p-6 mt-6'>
        <h3 className='text-lg font-semibold mb-4'>API Endpoint Tests</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <button
            onClick={async () => {
              try {
                const response = await axios.get(`${API_URL}/matching/stats`);
                alert(
                  "Stats API working: " + JSON.stringify(response.data.stats)
                );
              } catch (error) {
                alert("Stats API failed: " + error.message);
              }
            }}
            className='bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600'
          >
            Test Stats API
          </button>

          <button
            onClick={async () => {
              try {
                const response = await axios.get(
                  `${API_URL}/matching/discover`
                );
                alert(
                  "Discovery API working: Found " +
                    response.data.users.length +
                    " users"
                );
              } catch (error) {
                alert("Discovery API failed: " + error.message);
              }
            }}
            className='bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600'
          >
            Test Discovery API
          </button>
        </div>
      </div>
    </div>
  );
};

export default Debug;
