#!/usr/bin/env node

const API_BASE_URL = 'https://c5kwbeyw7b.execute-api.us-east-2.amazonaws.com/gamo'

// The college application text that was incorrectly stored
const collegeAppText = `Gasana, Moise FY ED Fall 2021 10/10/2000 CEEB: CAID: 20230314 FERPA: Waived Submitted: 10/31/2020...` // (truncated for brevity)

async function cleanProfile() {
  console.log('🧹 Cleaning and re-extracting profile data...\n')
  
  try {
    // Get current profile
    const getResponse = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_profile' })
    })
    
    const getData = await getResponse.json()
    const currentProfile = getData.body ? JSON.parse(getData.body).profile : getData.profile
    
    console.log('Current profile fetched')
    
    // Clean profile - extract proper values from the college app
    const cleanedProfile = {
      identity: {
        name: 'Moise Gasana',
        age: '26', // Born 10/10/2000
        location: 'Providence, RI (Brown University)',
        occupation: 'Student at Brown University',
        background: 'Rwandan student studying Computer Science and Economics at Brown University. Raised in Kigali, attended Agahozo Shalom Youth Village and Bridge2Rwanda.'
      },
      personality: {
        traits: 'Problem-solver, curious, ambitious, leadership-oriented, formerly introverted',
        humor: currentProfile.personality?.humor || 'Direct, no-nonsense',
        communication: 'Blunt, direct, expects attention to detail',
        energy: 'Introverted but confident in leadership roles, prefers deep 1-on-1 conversations',
        quirks: 'Blunt communicator, dislikes unnecessary permissions/confirmations'
      },
      lifeStory: {
        childhood: 'Raised by single mother in Kigali, Rwanda. Lost father at age 2. Experienced loneliness, found escape in movies and technology.',
        turningPoints: 'Step-siblings arrival (age 9), joining Agahozo Shalom Youth Village, becoming Student Government President, winning debate championships',
        achievements: '1st place Rwanda National Science Fair, 2x Kigali Debate League winner, 3rd globally Carnegie Mellon CS Academy, Silver Medal Queen\'s Commonwealth Essay, Student Government President',
        struggles: 'Early childhood loneliness, absent father, overworked mother, limited access to technology in early education',
        currentChapter: 'Computer Science and Economics student at Brown University (Fall 2021 cohort), focused on creating solutions for Rwanda and Africa'
      },
      values: {
        coreValues: 'Problem-solving, community impact, innovation, leadership, accountability',
        beliefs: 'Youth can drive change in Africa, technology enables solutions, human-centered leadership',
        dealbreakers: 'Gender discrimination, lack of accountability, inefficiency',
        priorities: 'Education, creating solutions for Rwanda, advancing CS and tech skills'
      },
      habits: {
        dailyRoutine: currentProfile.habits?.dailyRoutine || '',
        hobbies: 'Programming, debate, piano, essay writing, reading (economics, politics, AI, business)',
        guilty: currentProfile.habits?.guilty || '',
        productivity: 'Self-taught programmer, online courses (CodeAcademy, Carnegie Mellon CS Academy), problem-focused mindset'
      },
      dreams: {
        shortTerm: 'Excel at Brown University, build innovative solutions for Rwanda',
        longTerm: 'Create technological solutions for Rwanda and Africa, inspire youth-driven change',
        wildDream: 'Transform Rwanda and Africa through technology and innovation, be a living example of youth-driven change',
        legacy: 'Generation of young Africans creating solutions for their societies, youth empowerment in Rwanda'
      },
      fears: {
        deepFears: currentProfile.fears?.deepFears || '',
        insecurities: currentProfile.fears?.insecurities || '',
        avoidance: currentProfile.fears?.avoidance || ''
      },
      opinions: {
        hotTakes: 'Rwanda and Africa need innovative solutions in all sectors, youth must lead change, technology is the key to development',
        politics: currentProfile.opinions?.politics || '',
        technology: 'Programming is creativity and problem-solving, computers enable access to infinite possibilities, AI and tech are essential for Africa\'s future',
        life: 'Community and human connection are essential, problems exist everywhere and demand solutions, impossibilities are meant to be challenged'
      }
    }
    
    // Save cleaned profile
    const saveResponse = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'save_profile',
        profile: cleanedProfile
      })
    })
    
    if (!saveResponse.ok) {
      throw new Error(`Failed to save: ${saveResponse.status}`)
    }
    
    console.log('✅ Profile cleaned and saved!\n')
    console.log('═══════════════════════════════════════════════════════')
    console.log('\n📊 Cleaned Profile Summary:\n')
    
    for (const [category, fields] of Object.entries(cleanedProfile)) {
      const filledFields = Object.entries(fields).filter(([k, v]) => v && v.trim())
      if (filledFields.length > 0) {
        console.log(`\n📁 ${category.toUpperCase()} (${filledFields.length} fields)`)
        for (const [key, value] of filledFields) {
          const preview = value.length > 80 ? value.substring(0, 80) + '...' : value
          console.log(`  ✓ ${key}: ${preview}`)
        }
      }
    }
    
    const totalFilled = Object.values(cleanedProfile).reduce((sum, cat) => 
      sum + Object.entries(cat).filter(([k, v]) => v && v.trim()).length, 0
    )
    
    console.log('\n═══════════════════════════════════════════════════════')
    console.log(`\n📊 Total fields filled: ${totalFilled}/44`)
    console.log(`📈 Profile completeness: ${Math.round((totalFilled / 44) * 100)}%`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

cleanProfile()
