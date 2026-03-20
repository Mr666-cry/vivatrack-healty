import { NextRequest, NextResponse } from 'next/server'

// OpenRouter configuration
const OPENROUTER_API_KEY = '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'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface WeightPlan {
  target: string
  durasi: string
  kalori_harian: number
  olahraga: string[]
  makanan_dianjurkan: string[]
  makanan_dihindari: string[]
  tips: string[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentWeight, targetWeight, height, age, gender } = body

    if (!currentWeight || !targetWeight) {
      return NextResponse.json(
        { success: false, error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    const weightDiff = currentWeight - targetWeight
    const goal = weightDiff > 0 ? 'menurunkan' : 'menaikkan'
    const diff = Math.abs(weightDiff)

    const prompt = `Anda adalah ahli gizi dan fitness. Buatkan rencana untuk ${goal} berat badan ${diff}kg.

Data user:
- Berat saat ini: ${currentWeight}kg
- Target berat: ${targetWeight}kg
- Tinggi: ${height || 170}cm
- Umur: ${age || 25} tahun
- Gender: ${gender || 'pria'}

Berikan respons HANYA dalam format JSON valid tanpa markdown:
{"target":"deskripsi","durasi":"estimasi","kalori_harian":1800,"olahraga":["item1","item2"],"makanan_dianjurkan":["item1","item2"],"makanan_dihindari":["item1","item2"],"tips":["tip1","tip2"]}`

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    })

    if (!response.ok) {
      console.error('OpenRouter error:', await response.text())
      // Return fallback data
      return NextResponse.json({
        success: true,
        data: {
          target: `${goal === 'menurunkan' ? 'Menurunkan' : 'Menaikkan'} berat badan ${diff}kg`,
          durasi: '2-3 bulan',
          kalori_harian: goal === 'menurunkan' ? 1800 : 2500,
          olahraga: ['Jogging 30 menit', 'Senam aerobik', 'Yoga', 'Bersepeda'],
          makanan_dianjurkan: ['Sayuran hijau', 'Protein tanpa lemak', 'Buah-buahan', 'Oatmeal'],
          makanan_dihindari: ['Makanan cepat saji', 'Minuman manis', 'Gorengan', 'Makanan olahan'],
          tips: ['Minum air putih 8 gelas sehari', 'Tidur cukup 7-8 jam', 'Makan teratur', 'Hindari begadang']
        }
      })
    }

    const data = await response.json()
    let content = data.choices?.[0]?.message?.content || ''

    // Parse JSON from response
    try {
      let jsonStr = content.trim()
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      const plan: WeightPlan = JSON.parse(jsonStr)
      
      return NextResponse.json({
        success: true,
        data: plan
      })
    } catch {
      // Return fallback data if parsing fails
      return NextResponse.json({
        success: true,
        data: {
          target: `${goal === 'menurunkan' ? 'Menurunkan' : 'Menaikkan'} berat badan ${diff}kg`,
          durasi: '2-3 bulan',
          kalori_harian: goal === 'menurunkan' ? 1800 : 2500,
          olahraga: ['Jogging 30 menit', 'Senam aerobik', 'Yoga', 'Bersepeda'],
          makanan_dianjurkan: ['Sayuran hijau', 'Protein tanpa lemak', 'Buah-buahan', 'Oatmeal'],
          makanan_dihindari: ['Makanan cepat saji', 'Minuman manis', 'Gorengan', 'Makanan olahan'],
          tips: ['Minum air putih 8 gelas sehari', 'Tidur cukup 7-8 jam', 'Makan teratur', 'Hindari begadang']
        }
      })
    }

  } catch (error) {
    console.error('Weight target error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}
