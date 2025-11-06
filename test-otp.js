import { PrismaClient } from './dist/generated/client';

async function testOtpVerification() {
  const prisma = new PrismaClient();
  
  try {
    // Insert a test OTP code
    const testOtp = '123456';
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes from now
    
    await prisma.otpCode.create({
      data: {
        phone: '9380000000',
        code: testOtp,
        expiresAt: expiresAt,
        attempts: 0
      }
    });
    
    console.log(`Test OTP ${testOtp} created for phone 9380000000`);
    console.log('You can now test verify-otp endpoint with this code');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testOtpVerification();
