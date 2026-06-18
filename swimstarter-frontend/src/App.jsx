import { useState } from 'react';

function App() {
  // State variables to hold data from our inputs and API responses
  const [startId, setStartId] = useState(1);
  const [startData, setStartData] = useState(null);
  
  const [genre, setGenre] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // 1. Fetching from the Path Parameter endpoint (/start/{start_id})
  const fetchStartDetails = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/start/${startId}`);
      const data = await response.json();
      setStartData(data); // Save the JSON in our state
    } catch (error) {
      console.error("Error fetching start data:", error);
    }
  };

  // 2. Fetching from the Query Parameter endpoint (/search/?genre=X)
  const fetchSearch = async () => {
    if (!genre) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/search/?genre=${genre}`);
      const data = await response.json();
      setSearchResults(data.results); // Save just the array of results
    } catch (error) {
      console.error("Error searching:", error);
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>SwimStarter Dashboard</h1>
      <hr />

      {/* SECTION A: PATH PARAMETERS */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Get Start Details</h2>
        <input 
          type="number" 
          value={startId} 
          onChange={(e) => setStartId(e.target.value)} 
        />
        <button onClick={fetchStartDetails} style={{ marginLeft: '10px' }}>
          Fetch Start #{startId}
        </button>

        {/* If startData exists, render it on screen */}
        {startData && (
          <div style={{ background: '#f0f4f8', padding: '15px', marginTop: '10px', borderRadius: '5px' }}>
            <h3>{startData.title}</h3>
            <p>Calculated Status: {startData.calculated ? "✅ Ready" : "❌ Pending"}</p>
          </div>
        )}
      </section>

      {/* SECTION B: QUERY PARAMETERS */}
      <section>
        <h2>Search Starts by Genre</h2>
        <input 
          type="text" 
          placeholder="e.g., Butterfly, Freestyle" 
          value={genre} 
          onChange={(e) => setGenre(e.target.value)} 
        />
        <button onClick={fetchSearch} style={{ marginLeft: '10px' }}>
          Search
        </button>

        {/* Loop through results array if we have items */}
        {searchResults.length > 0 && (
          <ul style={{ marginTop: '10px' }}>
            {searchResults.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;