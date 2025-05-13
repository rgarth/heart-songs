# Heart Songs - YouTube API Integration Overview
## Audio-First Song Search and Playback Implementation

### Application Summary

**Heart Songs** is a multiplayer music game where players search for songs using Last.fm and stream them via YouTube embeds. Our implementation prioritizes audio content over music videos and uses intelligent caching to minimize API usage.

- **Live Application:** [https://heart-songs.vercel.app](https://heart-songs.vercel.app)
- **Source Code:** [https://github.com/rgarth/heart-songs](https://github.com/rgarth/heart-songs)
- **Expected API Usage:** 100-500 calls per day with caching

## 1. System Architecture

### Main Flow Diagram

```mermaid
flowchart TD
    A[Players join game] --> B[Host selects question]
    B --> C[Players search Last.fm for songs]
    C --> D[Players submit song choices]
    D --> E[Voting phase begins]
    E --> F{Check YouTube cache for each song}
    F -->|Cache Hit| G[Load cached YouTube ID]
    F -->|Cache Miss| H[Call YouTube API with audio preference]
    H --> I[Store result in cache]
    I --> G
    G --> J[Display YouTube embeds for voting]
    J --> K[Game continues with next round]
```

## 2. Audio-First Search Strategy

### Search Approach Logic

**Default Search Priority (Audio-first):**
1. `"artist track" + "official audio"`
2. `"artist track" + "audio"`
3. `"artist track" + "topic"`
4. `"artist track" + "official"`
5. `"artist track"` (fallback)

**When Video Preferred:**
1. `"artist track" + "music video"`
2. `"artist track" + "official video"`
3. `"artist track"` (fallback)

### Content Type Detection

```mermaid
graph LR
    A[YouTube Search Result] --> B{Analyze Title & Channel}
    B --> C{Contains 'official audio', 'topic'?}
    C -->|Yes| D[Classify as Audio]
    C -->|No| E{Contains 'music video', 'live'?}
    E -->|Yes| F[Classify as Video]
    E -->|No| G[Use Channel Type]
    G --> H{Topic Channel?}
    H -->|Yes| D
    H -->|No| I{VEVO Channel?}
    I -->|Yes| F
    I -->|No| J[Default to Audio]
```

## 3. Caching System

### Cache Strategy Overview

```mermaid
graph TB
    A[Song Request] --> B{Check Cache}
    B -->|Hit| C[Return Cached Result]
    B -->|Miss| D[YouTube API Call]
    D --> E[Store in Cache]
    E --> F[Return Result]
    
    G[Cache Management] --> H[90-day TTL]
    G --> I[Separate Audio/Video Storage]
    G --> J[Access Count Tracking]
```

### Cache Structure Logic

- **Unique Key:** `artist:track` (normalized, lowercase)
- **Dual Storage:** Separate entries for audio and video versions
- **Metadata:** Confidence scores, access counts, timestamps
- **Cleanup:** Automatic removal after 90 days of no access

## 4. Game Integration Flow

### Song Selection and Playback Process

```mermaid
sequenceDiagram
    participant P as Player
    participant L as Last.fm API
    participant G as Game Server
    participant C as YouTube Cache
    participant Y as YouTube API
    
    P->>L: Search for songs
    L->>P: Return song metadata
    P->>G: Submit song choice (no YouTube data)
    G->>G: Store submission
    
    Note over G: Voting phase begins
    
    G->>C: Check cache for submitted songs
    C->>G: Return cached results (if any)
    G->>Y: Search for uncached songs (audio-first)
    Y->>G: Return YouTube video IDs
    G->>C: Store new results in cache
    G->>P: Display YouTube embeds for voting
```

## 5. User Preference Handling

### Audio/Video Toggle Logic

```mermaid
graph LR
    A[User selects preference] --> B{Audio or Video?}
    B -->|Audio| C[Check audio cache]
    B -->|Video| D[Check video cache]
    C -->|Hit| E[Return audio YouTube ID]
    C -->|Miss| F[Search with audio strategies]
    D -->|Hit| G[Return video YouTube ID]
    D -->|Miss| H[Search with video strategies]
    F --> I[Cache audio result]
    H --> J[Cache video result]
    I --> E
    J --> G
```

## 6. Quota Management

### Error Handling Flow

```mermaid
graph TD
    A[YouTube API Call] --> B{Successful?}
    B -->|Yes| C[Process Results]
    B -->|No| D{Quota Exceeded?}
    D -->|Yes| E[Mark quota exhausted]
    D -->|No| F[Log other error]
    E --> G[Set reset time to midnight PST]
    G --> H[Return graceful fallback]
    F --> I[Return error to user]
```

### Fallback Mechanisms

- When quota exhausted: Provide direct YouTube search links
- Cache misses during quota limit: Return cached results only
- Complete failure: Game continues without YouTube embeds

## 7. Performance Optimization

### Cache Effectiveness

```mermaid
pie title API Call Distribution
    "Cache Hits (73%)" : 73
    "New API Calls (27%)" : 27
```

### Key Metrics

- **Cache Hit Rate:** 70-80%
- **Average Response Time:** 200-500ms
- **Daily API Calls:** 100-500 (with 10-15 active games)
- **Quota Utilization:** ~5-50% of daily limit

## 8. Implementation Benefits

### Efficiency Gains

1. **Reduced API Calls:** 70-80% reduction through caching
2. **Improved Performance:** Instant loading for cached content
3. **Better UX:** Audio-first approach matches user expectations
4. **Quota Management:** Graceful degradation during limits

### User Experience

- Seamless integration without interrupting game flow
- Preference toggle for audio vs. video content
- Automatic fallbacks when YouTube content unavailable
- Consistent experience across game sessions

## 9. Live Demonstration

Visit [heart-songs.vercel.app](https://heart-songs.vercel.app) to experience:

1. **Song Search:** Browse Last.fm catalog
2. **Game Flow:** Submit songs and enter voting phase
3. **YouTube Integration:** Watch automatic audio-first loading
4. **Preference Toggle:** Switch between audio and video modes
5. **Cache Indicators:** See when content loads from cache vs. API

The implementation showcases responsible API usage with efficient caching, audio-first prioritization, and smooth gameplay experience even during quota limitations.
