import { createId, verifyId } from "./dist/index.js"

// Test configuration
const TEST_ITERATIONS = 100
const MIN_LENGTH = 5
const MAX_LENGTH = 15

console.log("🧪 Starting ID System Tests...\n")

// Test 1: Generate + Verify for different lengths
console.log("📋 Test 1: Generate + Verify (Valid IDs)")
console.log("=".repeat(50))

let totalTests = 0
let passedTests = 0

for (let length = MIN_LENGTH; length <= MAX_LENGTH; length++) {
  console.log(`\n🔍 Testing ID length: ${length}`)

  let lengthPassed = 0

  for (let i = 0; i < TEST_ITERATIONS; i++) {
    try {
      // Generate ID
      const id = await createId(length)

      // Verify ID
      const isValid = await verifyId(id)

      totalTests++
      if (isValid) {
        passedTests++
        lengthPassed++
      } else {
        console.log(`❌ Failed verification for ID: ${id} (length: ${length})`)
      }
    } catch (error) {
      console.log(`💥 Error during test: ${error.message}`)
      totalTests++
    }
  }

  const successRate = ((lengthPassed / TEST_ITERATIONS) * 100).toFixed(1)
  console.log(`   ✅ Passed: ${lengthPassed}/${TEST_ITERATIONS} (${successRate}%)`)
}

console.log(
  `\n📊 Test 1 Summary: ${passedTests}/${totalTests} passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`,
)

// Test 2: Wrong tokens (should fail verification)
console.log("\n📋 Test 2: Wrong Tokens (Should Fail)")
console.log("=".repeat(50))

let wrongTokenTests = 0
let correctlyRejected = 0

for (let i = 0; i < TEST_ITERATIONS; i++) {
  try {
    // Generate a valid ID
    const validId = await createId(10)

    // Create wrong token by modifying the ID
    let wrongId = validId

    // Randomly modify 1-3 characters
    const modifications = Math.floor(Math.random() * 3) + 1
    for (let j = 0; j < modifications; j++) {
      const pos = Math.floor(Math.random() * wrongId.length)
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      let newChar = chars[Math.floor(Math.random() * chars.length)]

      // Ensure we actually change the character
      while (newChar === wrongId[pos]) {
        newChar = chars[Math.floor(Math.random() * chars.length)]
      }

      wrongId = wrongId.substring(0, pos) + newChar + wrongId.substring(pos + 1)
    }

    // Verify wrong ID (should fail)
    const isValid = await verifyId(wrongId)

    wrongTokenTests++
    if (!isValid) {
      correctlyRejected++
    } else {
      console.log(`❌ Wrong ID incorrectly validated: ${wrongId}`)
    }
  } catch (error) {
    console.log(`💥 Error during wrong token test: ${error.message}`)
    wrongTokenTests++
  }
}

const rejectionRate = ((correctlyRejected / wrongTokenTests) * 100).toFixed(1)
console.log(`\n📊 Test 2 Summary: ${correctlyRejected}/${wrongTokenTests} correctly rejected (${rejectionRate}%)`)

// Test 3: Edge cases
console.log("\n📋 Test 3: Edge Cases")
console.log("=".repeat(50))

// Test empty string
try {
  const emptyResult = await verifyId("")
  console.log(`Empty string verification: ${emptyResult ? "❌ PASSED (should fail)" : "✅ FAILED (correct)"}`)
} catch (error) {
  console.log(`Empty string verification: ✅ THREW ERROR (correct)`)
}

// Test very short ID
try {
  const shortResult = await verifyId("a")
  console.log(`Very short ID verification: ${shortResult ? "❌ PASSED (should fail)" : "✅ FAILED (correct)"}`)
} catch (error) {
  console.log(`Very short ID verification: ✅ THREW ERROR (correct)`)
}

// Test invalid characters (if any exist outside our alphabet)
try {
  const invalidResult = await verifyId("invalid@#$")
  console.log(`Invalid chars verification: ${invalidResult ? "❌ PASSED (should fail)" : "✅ FAILED (correct)"}`)
} catch (error) {
  console.log(`Invalid chars verification: ✅ THREW ERROR (correct)`)
}

// Final summary
console.log("\n🎯 Final Summary")
console.log("=".repeat(50))
console.log(`Valid ID Tests: ${passedTests}/${totalTests} passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`)
console.log(`Wrong Token Tests: ${correctlyRejected}/${wrongTokenTests} correctly rejected (${rejectionRate}%)`)

const overallSuccess = passedTests === totalTests && correctlyRejected === wrongTokenTests
console.log(`\n${overallSuccess ? "🎉 ALL TESTS PASSED!" : "⚠️  SOME TESTS FAILED"}`)

if (!overallSuccess) {
  process.exit(1)
}
