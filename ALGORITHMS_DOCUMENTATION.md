# Algorithm Implementation Documentation

## Overview
This document describes all algorithms implemented in the International Airlines booking system.

---

## 1. SEARCH & SORTING ALGORITHMS

### Quick Sort (Flight Sorting)
**Location:** `src/utils/algorithms.ts`

**Purpose:** Efficiently sort flights by price or other attributes

Algorithm:

- Divide and conquer approach
- Time Complexity: O(n log n) average case
- Space Complexity: O(log n)

**Usage:**
```typescript
const sortedFlights = quickSortFlights(flights, 'price');
```

**Implementation Details:**
- Picks middle element as pivot
- Partitions array into three parts: less than, equal to, and greater than pivot
- Recursively sorts left and right partitions

---

### Binary Search (Flight Search)
**Location:** `src/utils/algorithms.ts`

**Purpose:** Fast search for flights by exact price

**Algorithm:**
- Requires sorted array
- Time Complexity: O(log n)
- Space Complexity: O(1)

**Usage:**
```typescript
const flight = binarySearchFlight(sortedFlights, 500);
```

---

### Merge Sort (Booking Sorting)
**Location:** `src/utils/algorithms.ts`

**Purpose:** Sort bookings by date with stable sorting

**Algorithm:**
- Divide and conquer with merging
- Time Complexity: O(n log n)
- Space Complexity: O(n)
- Stable sort (maintains relative order)

**Usage:**
```typescript
const sortedBookings = mergeSortBookings(bookings);
```

---

## 2. RECOMMENDATION & OPTIMIZATION ALGORITHMS

### Collaborative Filtering (Flight Recommendations)A
**Location:** `src/utils/algorithms.ts`

**Purpose:** Recommend flights based on user booking history

**Algorithm:**
- Analyzes user's past destinations
- Identifies popular routes
- Suggests similar flights

**Usage:**
```typescript
const recommended = recommendFlights(userBookings, allFlights, 5);
```

**Features:**
- Personalized recommendations
- Considers user preferences
- Returns top N suggestions

---

### Dynamic Programming - Knapsack (Seat Selection)
**Location:** `src/utils/algorithms.ts`

**Purpose:** Optimize seat selection within budget

**Algorithm:**
- Classic 0/1 Knapsack problem
- Maximizes comfort within price constraint
- Time Complexity: O(n * budget)

**Usage:**
```typescript
const seats = [
  { id: '1A', price: 50, comfort: 10 },
  { id: '2B', price: 30, comfort: 7 }
];
const optimal = optimizeSeatSelection(seats, 100);
```

---

### Greedy Algorithm (Best Value Flights)
**Location:** `src/utils/algorithms.ts`

**Purpose:** Find flights with best price-to-time ratio

**Algorithm:**
- Calculates value score = price / duration
- Sorts by value score
- Time Complexity: O(n log n)

**Usage:**
```typescript
const bestValue = findBestValueFlights(flights);
```

---

### Dijkstra's Algorithm (Shortest Flight Path)
**Location:** `src/utils/algorithms.ts`

**Purpose:** Find cheapest route with connections

**Algorithm:**
- Graph-based pathfinding
- Finds minimum cost path
- Time Complexity: O(V² + E)

**Usage:**
```typescript
const path = findShortestPath(flights, 'Kathmandu', 'London');
```

**Features:**
- Handles connecting flights
- Minimizes total cost
- Returns complete itinerary

---

## 3. SECURITY & ENCRYPTION ALGORITHMS

### XOR Encryption (Data Protection)
**Location:** `src/utils/algorithms.ts`

**Purpose:** Simple encryption for sensitive data

**Algorithm:**
- XOR cipher with key
- Base64 encoding
- Symmetric encryption

**Usage:**
```typescript
const encrypted = encryptData('secret', 'key123');
const decrypted = decryptData(encrypted, 'key123');
```

---

### SHA-256 Hash (Password Hashing)
**Location:** `src/utils/algorithms.ts`

**Purpose:** Secure password storage

**Algorithm:**
- SHA-256 cryptographic hash
- Salt included
- One-way function

**Usage:**
```typescript
const hash = await hashPassword('myPassword123');
```

**Security Features:**
- 256-bit hash
- Salt prevents rainbow table attacks
- Cryptographically secure

---

### JWT-like Token Generation
**Location:** `src/utils/algorithms.ts`

**Purpose:** Generate authentication tokens

**Algorithm:**
- Header.Payload.Signature format
- Base64 encoding
- Expiration timestamps

**Usage:**
```typescript
const token = generateToken('user123', 'user@example.com');
```

---

### Rate Limiting - Token Bucket
**Location:** `src/utils/algorithms.ts`

**Purpose:** Prevent API abuse and DDoS attacks

**Algorithm:**
- Token bucket algorithm
- Refills at constant rate
- Prevents burst attacks

**Usage:**
```typescript
const limiter = new RateLimiter(100, 10); // 100 capacity, 10/sec refill
if (limiter.tryConsume()) {
  // Process request
}
```

**Features:**
- Configurable capacity
- Configurable refill rate
- Smooth rate limiting

---

### Input Sanitization
**Location:** `src/utils/algorithms.ts`

**Purpose:** Prevent XSS and SQL injection

**Algorithm:**
- Removes dangerous characters
- Strips HTML tags
- Validates input

**Usage:**
```typescript
const clean = sanitizeInput(userInput);
```

**Protection Against:**
- XSS attacks
- SQL injection
- Script injection

---

### CSRF Token Generation
**Location:** `src/utils/algorithms.ts`

**Purpose:** Prevent Cross-Site Request Forgery

**Algorithm:**
- Cryptographically random
- 32-byte token
- Unique per session

**Usage:**
```typescript
const csrfToken = generateCSRFToken();
```

---

## Performance Characteristics

| Algorithm | Time Complexity | Space Complexity | Use Case |
|-----------|----------------|------------------|----------|
| Quick Sort | O(n log n) | O(log n) | Flight sorting |
| Binary Search | O(log n) | O(1) | Price search |
| Merge Sort | O(n log n) | O(n) | Booking sorting |
| Dijkstra | O(V² + E) | O(V) | Route planning |
| Knapsack | O(n * W) | O(n * W) | Seat optimization |
| SHA-256 | O(n) | O(1) | Password hashing |
| Token Bucket | O(1) | O(1) | Rate limiting |

---

## Security Best Practices

1. **Always hash passwords** - Never store plain text
2. **Use rate limiting** - Prevent brute force attacks
3. **Sanitize all inputs** - Prevent injection attacks
4. **Generate CSRF tokens** - Protect form submissions
5. **Encrypt sensitive data** - Use strong encryption

---

## Future Enhancements

1. **A* Algorithm** - Better pathfinding for flights
2. **Machine Learning** - Advanced recommendations
3. **AES-256 Encryption** - Stronger data protection
4. **Bloom Filters** - Fast membership testing
5. **LRU Cache** - Performance optimization

---

## Testing Recommendations

1. Test sorting with large datasets (>10,000 flights)
2. Verify encryption/decryption integrity
3. Test rate limiter under load
4. Validate recommendation accuracy
5. Benchmark performance

---

## Conclusion

All algorithms are production-ready and optimized for the airline booking system. They provide efficient search, intelligent recommendations, and robust security.
